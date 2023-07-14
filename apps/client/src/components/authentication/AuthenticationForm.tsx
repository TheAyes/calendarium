import React, { Dispatch, FormEvent, SetStateAction, useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { Tab } from '../../types/AuthenticationTypes.ts';
import { CalendariumTheme } from '../../types/CalendariumTheme.ts';

const StyledAuthenticationForm = styled('form')`
	grid-column: 1/2;

	display: flex;
	flex-direction: column;

	gap: ${(props) => (props.theme as CalendariumTheme).spacing(0.75)};

	& > input {
		flex: 1;
		padding: 16px;
		color: ${(props) => (props.theme as CalendariumTheme).layers[0].text?.paragraphColor};
		font-weight: ${(props) => (props.theme as CalendariumTheme).typography?.h2?.fontWeight};
		position: relative;

		&[type='text'],
		&[type='password'],
		&[type='email'] {
			border-bottom: 2px solid
				${(props) => (props.theme as CalendariumTheme).layers[0].formElements?.inputField?.default.borderColor};

			&:hover {
				border-bottom: 2px solid
					${(props) =>
						(props.theme as CalendariumTheme).layers[0].formElements?.inputField?.hovered?.borderColor};
			}

			&:focus {
				border-bottom: 2px solid
					${(props) =>
						(props.theme as CalendariumTheme).layers[0].formElements?.inputField?.focused?.borderColor};
			}
		}

		&[type='submit'] {
			border: 2px solid
				${(props) => (props.theme as CalendariumTheme).layers[0].formElements?.inputField?.default.borderColor};

			&:hover {
				border: 2px solid
					${(props) =>
						(props.theme as CalendariumTheme).layers[0].formElements?.inputField?.hovered?.borderColor};
			}

			&:focus {
				border: 2px solid
					${(props) =>
						(props.theme as CalendariumTheme).layers[0].formElements?.inputField?.focused?.borderColor};
			}
		}

		&::placeholder {
			color: rgb(120, 120, 180);
		}

		@keyframes shake {
			10%,
			90% {
				transform: translate3d(-2px, 0, 0);
			}

			20%,
			80% {
				transform: translate3d(2px, 0, 0);
			}

			30%,
			50%,
			70% {
				transform: translate3d(-4px, 0, 0);
			}

			40%,
			60% {
				transform: translate3d(4px, 0, 0);
			}
		}
	}
`;

type AuthenticationFormProps = {
	tabs: Tab[];
	setTabs: Dispatch<SetStateAction<Tab[]>>;
	activeTab: number;
	[key: string]: unknown;
};

export const AuthenticationForm: React.FC<AuthenticationFormProps> = ({ tabs, activeTab, setTabs, ...props }) => {
	const [validState, setValidState] = useState<Record<string, boolean>>({});

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const userId = ((event.target as HTMLFormElement).elements[0] as HTMLInputElement).value;
		const password = ((event.target as HTMLFormElement).elements[1] as HTMLInputElement).value;

		const invalidFields = validateUserInput();
		if (invalidFields.length > 0) {
			// Handle invalid inputs here
			console.log('Invalid inputs: ', invalidFields);
			return;
		}

		console.table([userId, password]);
	};

	const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const displayName = ((event.target as HTMLFormElement).elements[0] as HTMLInputElement).value;
		const userId = ((event.target as HTMLFormElement).elements[1] as HTMLInputElement).value;
		const email = ((event.target as HTMLFormElement).elements[2] as HTMLInputElement).value;
		const password = ((event.target as HTMLFormElement).elements[3] as HTMLInputElement).value;
		const confirmPassword = ((event.target as HTMLFormElement).elements[4] as HTMLInputElement).value;

		const invalidFields = validateUserInput();
		if (invalidFields.length > 0) {
			// Handle invalid inputs here
			console.log('Invalid inputs: ', invalidFields);
			return;
		}

		console.table([displayName, userId, email, password, confirmPassword]);
	};

	const handleFocus = (key: string) => {
		const newTabs = tabs.map((tab, index) =>
			index !== activeTab
				? tab
				: {
						...tab,
						content: tab.content.map((item) => (item.key === key ? { ...item, isFocused: true } : item)),
				  }
		);
		setTabs(newTabs);
	};

	const handleBlur = (key: string) => {
		const newTabs = tabs.map((tab, index) =>
			index !== activeTab
				? tab
				: {
						...tab,
						content: tab.content.map((item) => (item.key === key ? { ...item, isFocused: false } : item)),
				  }
		);
		setTabs(newTabs);
	};

	const validateUserInput = useCallback(
		(_key?: string, _value?: string, _activeTab?: number) => {
			let invalidFields: string[] = [];
			const validState = {};
			if (_key !== undefined && _value !== undefined) {
				if (_activeTab !== undefined) {
					// Validate only the relevant input field
					const contents = tabs[_activeTab].content;
					const item = contents.find((c) => c.key === _key);
					if (item?.rules) {
						item.rules.forEach((rule) => {
							const isValid = rule.checkFunction(_value, contents);
							if (!isValid) invalidFields.push(_key);
						});
					}

					(validState as Record<string, boolean>)[_key] = !invalidFields.includes(_key);
				}
			} else {
				// Old code to validate all fields
				const contents = tabs[activeTab].content;
				contents.forEach((item) => {
					item.rules?.forEach((rule) => {
						const isValid = rule.checkFunction(item.value, contents);
						if (!isValid) invalidFields.push(item.key);
					});
				});

				contents.forEach((item) => {
					(validState as Record<string, boolean>)[item.key] = !invalidFields.includes(item.key);
				});
			}

			setValidState(validState);
			console.log(invalidFields);
			return invalidFields;
		},
		[tabs, activeTab]
	);

	const handleInput = useCallback(
		(key: string, value: string) => {
			setValidState({});

			let newTabs = [...tabs];
			newTabs = newTabs.map((tab, index) =>
				index !== activeTab
					? tab
					: {
							...tab,
							content: tab.content.map((item) => (item.key === key ? { ...item, value } : item)),
					  }
			);

			newTabs[activeTab].content.forEach((item) => {
				item.rules?.forEach((rule) => {
					rule.checkFunction(value, newTabs[activeTab].content);
				});
			});

			setTabs(newTabs);
			validateUserInput(key, value, activeTab);
		},
		[activeTab, tabs]
	);

	return (
		<StyledAuthenticationForm onSubmit={[handleLogin, handleRegister][activeTab]} {...props}>
			<AnimatePresence mode="popLayout">
				{tabs[activeTab].content.map((currentItem, index) => {
					return (
						<motion.input
							key={currentItem.key}
							layout
							initial={{
								opacity: 0,
								x: 100,
							}}
							animate={{
								opacity: 1,
								x: 0,
								transition: {
									delay: index * 0.1 + 0.2,
								},
							}}
							exit={{
								opacity: 0,
								x: -100,
							}}
							transition={{
								type: 'spring',
								duration: 0.5,
								stiffness: 120,
								damping: 14,
							}}
							style={{
								border: validState[currentItem.key] === false ? '2px solid red' : undefined,
								animation:
									validState[currentItem.key] === false
										? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both'
										: undefined,
							}}
							type={currentItem.type}
							placeholder={currentItem.placeholder}
							onFocus={() => handleFocus(currentItem.key)}
							onBlur={() => handleBlur(currentItem.key)}
							onChange={(event) => handleInput(currentItem.key, event.target.value)}
						/>
					);
				})}
			</AnimatePresence>
		</StyledAuthenticationForm>
	);
};
